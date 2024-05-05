import os


def get_type(x):
    types = ['JPG','JPEG','MP4','MOV','PNG']

    for i in range(5):
        if types[i] in x.upper():
            return [i, types[i]]
    return [999,'ERROR']


type_counts = [1,1,1,1,1]

path = "C:\\Users\\nicho\\Downloads\\US_Canada_2023\\iCloud Photos"
files = sorted(os.listdir(path))

for f in files:
    p = os.path.join(path, f)
    type_no, type_name = get_type(f)
    new_p = os.path.join(path, type_name + '_' + str(type_counts[type_no])+'.'+type_name)

    while os.path.exists(new_p):
        type_counts[type_no]+=1
        new_p =  os.path.join(path, type_name + '_' + str(type_counts[type_no])+'.'+type_name)
    type_counts[type_no]+=1
    
    os.rename(p, new_p)
    print(new_p)


